@echo off
chcp 65001 >nul
title Dọn dẹp dữ liệu test - Ecommerce Monolith (TH2)
echo ======================================================================
echo             DỌN DẸP DỮ LIỆU TEST - ECOMMERCE MONOLITH (TH2)
echo ======================================================================
echo.

echo [1/3] Đang dọn dẹp các đơn hàng, chi tiết đơn và vận chuyển...
docker exec -i ecommerce-postgres psql -U ecommerce -d ecommerce -c "DELETE FROM \"Shipment\"; DELETE FROM \"OrderDetail\"; DELETE FROM \"Order\";" >nul 2>&1
echo     Đã dọn sạch Shipment, OrderDetail, Order.

echo.
echo [2/3] Đang dọn dẹp sản phẩm demo X, Y và tài khoản khách test...
docker exec -i ecommerce-postgres psql -U ecommerce -d ecommerce -c "DELETE FROM \"Product\" WHERE pname IN ('X', 'Y'); DELETE FROM \"User\" WHERE username IN ('khach01', 'demo_user');" >nul 2>&1
echo     Đã dọn sạch sản phẩm X, Y và tài khoản khách test.

echo.
echo [3/3] Kiểm tra lại số lượng sản phẩm X, Y và tài khoản test trong Database:
docker exec -i ecommerce-postgres psql -U ecommerce -d ecommerce -c "SELECT count(*) AS remaining_products FROM \"Product\" WHERE pname IN ('X', 'Y'); SELECT count(*) AS remaining_test_users FROM \"User\" WHERE username IN ('khach01', 'demo_user');"

echo.
echo ======================================================================
echo  [HOÀN TẤT] Dữ liệu test TH2 đã được dọn sạch hoàn toàn!
echo  Bạn có thể thực hiện lại kịch bản test và demo từ đầu.
echo ======================================================================
pause
